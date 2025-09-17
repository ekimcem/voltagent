// Helper function to convert Zod schema to JSON Schema
export function zodToJsonSchema(zodSchema: any): any {
  // Handle null/undefined schemas
  if (!zodSchema) {
    console.warn("zodToJsonSchema received null/undefined schema, returning empty object schema");
    return { type: "object", properties: {} };
  }

  // Check if it's not a Zod schema at all (might be already a JSON schema)
  if (typeof zodSchema === "object" && zodSchema.type && !zodSchema._def && !zodSchema.def) {
    console.warn("zodToJsonSchema received what appears to be a JSON schema, returning as-is");
    return zodSchema;
  }

  // Get the definition object - could be _def or def
  const def = zodSchema._def || zodSchema.def;

  // Check if the schema has a definition property and typeName
  if (!def || !def.typeName) {
    console.warn("zodToJsonSchema received invalid Zod schema structure:", {
      hasDefinition: !!def,
      has_def: !!zodSchema._def,
      hasDef: !!zodSchema.def,
      keys: zodSchema ? Object.keys(zodSchema).slice(0, 10) : [],
      type: typeof zodSchema,
      defKeys: def ? Object.keys(def) : [],
    });
    // Return a permissive schema as fallback
    return { type: "object", properties: {}, additionalProperties: true };
  }

  const typeName = def.typeName;

  // Handle ZodObject type
  if (typeName === "ZodObject") {
    let shape: any = {};

    // Try different ways to get the shape
    if (typeof def.shape === "function") {
      try {
        shape = def.shape();
      } catch (e) {
        console.warn("Error calling def.shape():", e);
        shape = {};
      }
    } else if (zodSchema.shape) {
      shape = zodSchema.shape;
    } else if (def.shape) {
      shape = def.shape;
    }

    const properties: any = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const field = value as any;
      if (!field) continue;

      // Get field definition - could be _def or def
      const fieldDef = field._def || field.def;
      if (!fieldDef) continue;

      if (fieldDef.typeName === "ZodString") {
        properties[key] = {
          type: "string",
          description: fieldDef.description || undefined,
        };
      } else if (fieldDef.typeName === "ZodNumber") {
        properties[key] = {
          type: "number",
          description: fieldDef.description || undefined,
        };
      } else if (fieldDef.typeName === "ZodArray") {
        properties[key] = {
          type: "array",
          items: { type: "string" }, // Simplified for string arrays
          description: fieldDef.description || undefined,
        };
      } else if (fieldDef.typeName === "ZodOptional") {
        const innerType = fieldDef.innerType;
        if (!innerType) continue;

        const innerSchema = innerType._def || innerType.def;
        if (!innerSchema) continue;

        if (innerSchema.typeName === "ZodString") {
          properties[key] = {
            type: "string",
            description: innerSchema.description || undefined,
          };
        } else if (innerSchema.typeName === "ZodNumber") {
          properties[key] = {
            type: "number",
            description: innerSchema.description || undefined,
          };
        } else if (innerSchema.typeName === "ZodArray") {
          properties[key] = {
            type: "array",
            items: { type: "string" },
            description: innerSchema.description || undefined,
          };
        }
        // Optional fields are not added to required array
        continue;
      }

      // Add to required if not optional
      if (fieldDef.typeName !== "ZodOptional") {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  // Handle other simple types as fallback
  if (typeName === "ZodString") {
    return { type: "string" };
  }
  if (typeName === "ZodNumber") {
    return { type: "number" };
  }
  if (typeName === "ZodBoolean") {
    return { type: "boolean" };
  }
  if (typeName === "ZodArray") {
    return { type: "array", items: { type: "string" } };
  }

  // Default fallback for unknown types
  console.warn(`Unknown Zod type: ${typeName}, defaulting to object schema`);
  return { type: "object", properties: {} };
}
