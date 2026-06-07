import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

import { User } from "../entities/User";
// import { Repository }     from "../entities/Repository";
// import { AnalysisJob }    from "../entities/AnalysisJob";
// import { AnalysisReport } from "../entities/AnalysisReport";
// import { Issue }          from "../entities/Issue";
// import { IssueComment }   from "../entities/IssueComment";
// import { Subscription }   from "../entities/Subscription";
// import { AuditLog }       from "../entities/AuditLog";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME ?? "code_review_db",
    username: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "1234",

    synchronize: process.env.DB_SYNC === "true", // true in dev only — never in prod
    logging: process.env.DB_LOGGING === "true",

    //   entities:   [User, Repository, AnalysisJob, AnalysisReport, Issue, IssueComment, Subscription, AuditLog],
    entities: [User],
    migrations: [__dirname + "/../migrations/*.ts"],

    extra: {
        max: 20,   // max connections in pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },
});

export const connectDB = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        console.log("PostgreSQL connected");
    } catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
};