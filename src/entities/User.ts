import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';

@ObjectType()
@Entity()
export class User {
    @Field()
    @PrimaryKey()
    _id!: string;

    @Field(() => String)
    @Property({ type: 'date' })
    createdAt = new Date();

    @Field(() => String)
    @Property({ type: 'date', onUpdate: () => new Date() })
    updatedAt = new Date();

    @Field(() => String, { nullable: true })
    @Property({ type: 'date' })
    deletedAt = new Date();

    @Field()
    @Unique()
    @Property({ type: 'text', unique: true })
    username!: string;

    @Property({ type: 'text' })
    password!: string;
}
