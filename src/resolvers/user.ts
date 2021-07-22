import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from 'type-graphql';
import { AppContext } from '../types';
import { User } from '../entities/User';
import argon2 from 'argon2';

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;
    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export default class UserResolver {
    @Query(() => User, { nullable: true })
    async me(@Ctx() { em, req }: AppContext): Promise<User | null> {
        if (!req.session.userId) {
            return null;
        }

        return await em.findOne(User, { _id: req.session.userId });
    }

    @Mutation(() => UserResponse)
    async register(@Arg('options') options: UsernamePasswordInput, @Ctx() { em }: AppContext): Promise<UserResponse> {
        if (options.username.length <= 3) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'length must be greater than 3',
                    },
                ],
            };
        }

        if (options.password.length <= 8) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'length must be greater than 8',
                    },
                ],
            };
        }

        const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, { username: options.username, password: hashedPassword });
        try {
            await em.persistAndFlush(user);
        } catch (e) {
            if (e.code === 11000) {
                return {
                    errors: [
                        {
                            field: 'username',
                            message: 'User with this name already exists',
                        },
                    ],
                };
            } else {
                return {
                    errors: [
                        {
                            field: 'unknown',
                            message: 'Something went wrong...',
                        },
                    ],
                };
            }
        }
        return { user };
    }

    @Mutation(() => UserResponse)
    async login(@Arg('options') options: UsernamePasswordInput, @Ctx() { em, req }: AppContext): Promise<UserResponse> {
        const user = await em.findOne(User, { username: options.username });

        if (!user) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: "that username doesn't exist",
                    },
                ],
            };
        }

        const valid = await argon2.verify(user.password, options.password);

        if (!valid) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'invalid credentials',
                    },
                ],
            };
        }

        req.session.userId = user._id;

        return {
            user,
        };
    }
}
