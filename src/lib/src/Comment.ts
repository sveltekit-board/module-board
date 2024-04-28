import { runQuery } from "@sveltekit-board/db";

export default class Comment {
    readonly name: string;
    readonly tableName: string;
    constructor(name: string) {
        this.name = name;
        this.tableName = `board/comment/${this.name}`;
    }

    static async getComment(name: string) {
        if (!/^[a-zA-Z0-9_]*$/.test(name)) return null;
        return await runQuery(async (run): Promise<Comment | null> => {
            const tables = (await run("SHOW TABLES") as any[]).map(e => Object.values(e)[0])
            if (!tables.includes(`board/comment/${name}`)) return null;

            return new Comment(name);
        })
    }

    static async createComment(name: string) {
        if (!/^[a-zA-Z0-9_]*$/.test(name)) return null;
        return await runQuery(async (run): Promise<Comment | null> => {
            const tables = (await run("SHOW TABLES") as any[]).map(e => Object.values(e)[0])
            if (tables.includes(`board/comment/${name}`)) return null;

            await run(`CREATE TABLE \`board/comment/${name}\` ( 
                \`commentId\` int(11) NOT NULL, 
                \`content\` longtext DEFAULT NULL, 
                \`commenterProvider\` tinytext DEFAULT NULL, 
                \`commenterProviderId\` text DEFAULT NULL, 
                \`createdTime\` bigint(20) NOT NULL, 
                \`isEdited\` tinyint(1) NOT NULL DEFAULT 0,
                \`postId\` int(11) NOT NULL,
                \`topId\` int(11) DEFAULT NULL,
                \`parentId\` int(11) DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`);
            await run(`ALTER TABLE \`board/comment/${name}\` ADD PRIMARY KEY (\`commentId\`);`);
            await run(`ALTER TABLE \`board/comment/${name}\` MODIFY \`commentId\` int(11) NOT NULL AUTO_INCREMENT;`);

            return new Comment(name);
        })
    }

    static async dropComment(name: string) {
        if (!/^[a-zA-Z0-9_]*$/.test(name)) return null;
        return await runQuery(async (run) => {
            const tables = (await run("SHOW TABLES") as any[]).map(e => Object.values(e)[0])
            if (!tables.includes(`board/comment/${name}`)) return null;

            return await run(`DROP TABLE \`board/comment/${name}\``);
        })
    }

    async write(content: string, postId: number, writer: { provider: string, providerId: string }, topId: number | null = null, parentId: number | null = null) {
        return await runQuery(async (run) => {
            return await run(`INSERT INTO \`${this.tableName}\` (
                \`content\`, 
                \`commenterProvider\`, 
                \`commenterProviderId\`, 
                \`createdTime\`, 
                \`postId\`, 
                \`topId\`, 
                \`parentId\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`, [content, writer.provider, writer.providerId, Date.now(), postId, topId, parentId])
        })
    }

    async getTop(postId: number, start: number, limit: number): Promise<(CommentType & {parentId: null;topId: null})[]> {
        return (await runQuery(async (run) => {
            return await run(`SELECT * FROM \`${this.tableName}\` WHERE \`postId\` = ? AND \`topId\` IS NULL ORDER BY \`commentId\` DESC LIMIT ?, ?`, [postId, start, limit])
        }))
    }

    async getReply(postId:number, parentId:number, start:number, limit:number): Promise<(CommentType & {parentId: number;topId: number})[]> {
        return (await runQuery(async (run) => {
            return await run(`SELECT * FROM \`${this.tableName}\` WHERE \`postId\` = ? AND \`parentId\` = ? ORDER BY \`commentId\` DESC LIMIT ?, ?`, [postId, parentId, start, limit])
        }))
    }

    async remove(commentId:number){
        return await runQuery(async(run) => {
            let exists = Boolean(Object.values((await run(`SELECT EXISTS(SELECT * FROM \`${this.tableName}\` WHERE \`parentId\` = ?)`, [commentId]))[0])[0])
            if(exists){
                return await run(`UPDATE \`${this.tableName}\` SET \`content\` = NULL, \`commenterProvider\` = NULL, \`commenterProviderId\` = NULL WHERE \`commentId\` = ?`, [commentId]);
            }
            else{
                return await run(`DELETE FROM \`${this.tableName}\` WHERE \`commentId\` = ?`, [commentId])
            }
        })
    }
}

export interface CommentType {
    commentId: number,
    content: string|null,
    commenterProvider: string,
    commenterProviderId: string,
    createdTime: number,
    isEdited: 1|0,
    postId: number,
    topId: number | null,
    parentId: number | null
}