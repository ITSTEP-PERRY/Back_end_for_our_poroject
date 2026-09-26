namespace Perry.Domain.Primitives;

public record Error(string Code, string? Description = default)
{
    public static Error None => new(String.Empty);
    public static Error Failed => new(nameof(Failed));
    public static implicit operator Result(Error error) => Result.Failure(error);
}