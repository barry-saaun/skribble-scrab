import openapiTS, { astToString } from "openapi-typescript";
import ts from "typescript";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "../openapi.yaml");
const outputPath = resolve(__dirname, "../src/api/v1.d.ts");

const DATE_TYPE = ts.factory.createTypeReferenceNode(
  ts.factory.createIdentifier("Date"),
);
const NULL_TYPE = ts.factory.createLiteralTypeNode(ts.factory.createNull());

const ast = await openapiTS(new URL(`file://${schemaPath}`), {
  transform(schemaObject) {
    if ("format" in schemaObject && schemaObject.format === "date-time") {
      return schemaObject.nullable
        ? ts.factory.createUnionTypeNode([DATE_TYPE, NULL_TYPE])
        : DATE_TYPE;
    }
  },
});

writeFileSync(outputPath, astToString(ast));
console.log("+++ Generated src/api/v1.d.ts");
