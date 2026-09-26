namespace Perry.Domain.Primitives;

public record Statistic<TValue>
{
    public string Name { get;set; }
    public TValue Value { get;set; }
}