type ClassDecoratorFactory = (...args: unknown[]) => PropertyDecorator;

function resolveDecorator(
  packageName: string,
  exportName: string,
): ClassDecoratorFactory {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const moduleRef = require(packageName) as Record<string, unknown>;
    const decorator = moduleRef[exportName];
    if (typeof decorator === 'function') {
      return decorator as ClassDecoratorFactory;
    }
  } catch {
    // Fallback to no-op decorator when package is not installed.
  }

  return () => () => undefined;
}

export const IsArray = resolveDecorator('class-validator', 'IsArray');
export const ArrayMinSize = resolveDecorator('class-validator', 'ArrayMinSize');
export const IsString = resolveDecorator('class-validator', 'IsString');
export const IsOptional = resolveDecorator('class-validator', 'IsOptional');
export const MinLength = resolveDecorator('class-validator', 'MinLength');
export const MaxLength = resolveDecorator('class-validator', 'MaxLength');
export const IsIn = resolveDecorator('class-validator', 'IsIn');
export const IsInt = resolveDecorator('class-validator', 'IsInt');
export const Min = resolveDecorator('class-validator', 'Min');
export const IsBoolean = resolveDecorator('class-validator', 'IsBoolean');
export const ValidateNested = resolveDecorator(
  'class-validator',
  'ValidateNested',
);
export const Type = resolveDecorator('class-transformer', 'Type');
