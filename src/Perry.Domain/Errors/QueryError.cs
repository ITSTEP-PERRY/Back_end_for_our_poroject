using Perry.Domain.Primitives;

namespace Perry.Domain.Errors;

public static class QueryError
{
    public static Error EntityNotExist = new Error(nameof(EntityNotExist));
    public static Error Conflict = new Error(nameof(Conflict), "Review already exists for this user and product");
}
