using Perry.Domain.Primitives;

namespace Perry.Domain.Errors;

public static class QueryError
{
    public static Error EntityNotExist = new Error(nameof(EntityNotExist));
}