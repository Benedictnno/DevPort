import { describe, it, expect } from "vitest";
import { parseOpenApiSpec } from "@/modules/documentation/openapi.parser";

describe("OpenAPI / Swagger Parser", () => {
  it("should parse OpenAPI 3.0 YAML specification", () => {
    const yamlContent = `
openapi: 3.0.0
info:
  title: PetStore API
  version: 1.0.0
  description: A sample pet store API
servers:
  - url: https://api.petstore.example.com/v1
paths:
  /pets:
    get:
      summary: List all pets
      tags:
        - pets
      responses:
        "200":
          description: A paged array of pets
    post:
      summary: Create a pet
      tags:
        - pets
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
  /pets/{petId}:
    get:
      summary: Info for a specific pet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
    delete:
      summary: Delete a pet
`;

    const result = parseOpenApiSpec(yamlContent);
    expect(result).not.toBeNull();
    expect(result?.title).toBe("PetStore API");
    expect(result?.version).toBe("1.0.0");
    expect(result?.baseUrl).toBe("https://api.petstore.example.com/v1");
    expect(result?.endpoints).toHaveLength(4);

    const getPets = result?.endpoints.find((e) => e.path === "/pets" && e.method === "GET");
    expect(getPets).toBeDefined();
    expect(getPets?.summary).toBe("List all pets");
    expect(getPets?.tags).toContain("pets");

    const getPetById = result?.endpoints.find((e) => e.path === "/pets/{petId}" && e.method === "GET");
    expect(getPetById?.parameters).toHaveLength(1);
    expect(getPetById?.parameters?.[0].name).toBe("petId");
  });

  it("should parse Swagger 2.0 JSON specification", () => {
    const jsonContent = JSON.stringify({
      swagger: "2.0",
      info: {
        title: "Swagger Sample API",
        version: "2.0.0",
      },
      host: "api.example.com",
      basePath: "/v2",
      schemes: ["https"],
      paths: {
        "/users": {
          get: {
            summary: "List users",
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    });

    const result = parseOpenApiSpec(jsonContent);
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Swagger Sample API");
    expect(result?.baseUrl).toBe("https://api.example.com/v2");
    expect(result?.endpoints).toHaveLength(1);
    expect(result?.endpoints[0].method).toBe("GET");
    expect(result?.endpoints[0].path).toBe("/users");
  });

  it("should return null for non-API content", () => {
    const markdown = "# Hello World\nThis is a readme";
    expect(parseOpenApiSpec(markdown)).toBeNull();
  });
});
