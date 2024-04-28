import { runQuery } from "@sveltekit-board/db";

export default class Board {
    readonly name: string;
    readonly tableName: string;
    useHistory:boolean = true;
    constructor(name: string) {
        this.name = name;
        this.tableName = `board/main/${this.name}`;
    }

    static async getBoard(name: string): Promise<Board | null> {
        if (!/^[a-zA-Z0-9_]*$/.test(name)) return null;
        return await runQuery(async (run): Promise<Board | null> => {
            const tables = (await run("SHOW TABLES") as any[]).map(e => Object.values(e)[0])
            if (!tables.includes(`board/main/${name}`)) return null;

            return new Board(name);
        })
    }

    static async createBoard(name: string) {
        if (!/^[a-zA-Z0-9_]*$/.test(name)) return null;
        return await runQuery(async (run): Promise<Board | null> => {
            const tables = (await run("SHOW TABLES") as any[]).map(e => Object.values(e)[0])
            if (tables.includes(`board/main/${name}`)) return null;

            await run(`CREATE TABLE \`board/main/${name}\` ( \`postId\` int(11) NOT NULL, \`title\` text NOT NULL, \`content\` longtext NOT NULL, \`authorProvider\` tinytext NOT NULL, \`authorProviderId\` text NOT NULL, \`createdTime\` bigint(20) NOT NULL, \`lastEditedTime\` bigint(20) DEFAULT NULL, \`original\` int(11) DEFAULT NULL ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`);
            await run(`ALTER TABLE \`board/main/${name}\` ADD PRIMARY KEY (\`postId\`);`);
            await run(`ALTER TABLE \`board/main/${name}\` MODIFY \`postId\` int(11) NOT NULL AUTO_INCREMENT;`);

            return new Board(name);
        })
    }

    static async dropBoard(name: string){
        if (!/^[a-zA-Z0-9_]*$/.test(name)) return null;
        return await runQuery(async (run) => {
            const tables = (await run("SHOW TABLES") as any[]).map(e => Object.values(e)[0])
            if (!tables.includes(`board/main/${name}`)) return null;

            return await run(`DROP TABLE \`board/main/${name}\``);
        })
    }

    async write(title:string, content:string, writer:{provider:string, providerId:string}){
        const {provider, providerId} = writer;

        return await runQuery(async(run) => {
            return await run(`INSERT INTO \`${this.tableName}\` (\`title\`, \`content\`, \`authorProvider\`, \`authorProviderId\`, \`createdTime\`) VALUES (?, ?, ?, ?, ?)`, [title, content, provider, providerId, Date.now()]);
        })
    }

    async edit(title: string, content:string, postId: number){
        return await runQuery(async(run) => {
            const original = await run(`SELECT * FROM \`${this.tableName}\` WHERE \`postId\` = ?`, [postId])
            if(original.length === 0) return null;

            if(this.useHistory){
                return await run(`INSERT INTO \`${this.tableName}\` (\`title\`, \`content\`, \`authorProvider\`, \`authorProviderId\`, \`createdTime\`, \`original\`) VALUES (?, ?, ?, ?, ?, ?)`, [title, content, original[0].authorProvider, original[0].authorProviderId, Date.now(), postId]);
            }
            else{
                return await run(`UPDATE \`${this.tableName}\` SET \`title\` = ?, \`content\` = ?, \`lastEditedTime\` = ? WHERE \`postId\` = ?`, [title, content, Date.now(), postId])
            }
        })
    }

    async remove(postId:number){
        return await runQuery(async(run) => {
            return await run(`DELETE FROM \`${this.tableName}\` WHERE \`postId\` = ? OR \`original\` = ?`, [postId, postId])
        })
    }
}