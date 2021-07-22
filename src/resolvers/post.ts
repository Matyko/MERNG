import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Post } from '../entities/Post';
import { AppContext } from '../types';

@Resolver()
export default class PostResolver {
    @Query(() => [Post])
    async posts(@Ctx() { em }: AppContext): Promise<Post[]> {
        return (await em.find(Post, {})).filter((e) => !e.deletedAt);
    }

    @Query(() => Post, { nullable: true })
    post(@Arg('_id') _id: string, @Ctx() { em }: AppContext): Promise<Post | null> {
        return em.findOne(Post, { _id });
    }

    @Mutation(() => Post)
    async createPost(@Arg('title') title: string, @Ctx() { em }: AppContext): Promise<Post> {
        const post = em.create(Post, { title });
        await em.persistAndFlush(post);
        return post;
    }

    @Mutation(() => Post, { nullable: true })
    async updatePost(
        @Arg('_id') _id: string,
        @Arg('title') title: string,
        @Ctx() { em }: AppContext,
    ): Promise<Post | null> {
        const post = await em.findOne(Post, { _id });
        if (!post) {
            return null;
        }
        post.title = title;
        await em.persistAndFlush(post);
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(@Arg('_id') _id: string, @Ctx() { em }: AppContext): Promise<boolean> {
        try {
            const post = await em.findOne(Post, { _id });
            if (!post) {
                return null;
            }
            post.deletedAt = new Date();
            await em.persistAndFlush(post);
            return true;
        } catch (e) {
            return false;
        }
    }
}
