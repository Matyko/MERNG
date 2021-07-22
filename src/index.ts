import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import * as dotenv from 'dotenv';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import UserResolver from './resolvers/user';
import { __prod__ } from './constants';
import PostResolver from './resolvers/post';
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { AppContext } from './types';

dotenv.config();

const main = async () => {
    const orm = await MikroORM.init({
        entities: ['./dist/entities/**/*.js'],
        entitiesTs: ['./src/entities/**/*.ts'],
        dbName: 'merng',
        clientUrl: process.env.MONGODB,
        type: 'mongo',
        debug: !__prod__,
        ensureIndexes: true,
    });

    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    app.use(
        session({
            name: 'qid',
            store: new RedisStore({
                client: redisClient,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
                httpOnly: true,
                sameSite: 'lax',
                secure: __prod__,
            },
            saveUninitialized: false,
            secret: process.env.REDIS_SECRET,
            resave: false,
        }),
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver, PostResolver],
            validate: false, // TODO check this
        }),
        context: ({ req, res }): AppContext => ({ em: orm.em, req, res }),
    });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log('server started on localhost:4000');
    });
};

main();
