// import crypto from "crypto";

import {DefaultNamingStrategy, NamingStrategyInterface, Table} from "typeorm";

export class CustomNamingStrategy
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    foreignKeyName(
        tableOrName: Table | string,
        columnNames: string[],
        referencedTablePath?: string,
        referencedColumnNames?: string[]
    ): string {
        tableOrName =
            typeof tableOrName === "string" ? tableOrName : tableOrName.name;

        const name = columnNames.reduce(
            (name, column) => `${name}_${column}`,
            `${tableOrName}_${referencedTablePath}`
        );

        // return `FK_${crypto.createHash("md5").update(name).digest("hex")}`;
        return `FK_${name}`;
    }
}
