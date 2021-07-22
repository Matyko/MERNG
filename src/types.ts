import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { Session } from 'express-session';

export type AppContext = {
    em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
    req: Request & { session: Session };
    res: Response;
};

declare module 'express-session' {
    export interface SessionData {
        userId: string;
    }
}
