namespace Perry.Infrastructure.Options;

/// <summary>
/// Parameters for pagination, sorting, and filtering data.
/// </summary>
public record QueryOptions
{
    public int CurrentPage { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public string? OrderPropertyName { get; set; }
    public bool DescendingOrder { get; set; }
    public string? SearchPropertyName { get; set; }
    public string? SearchTerm { get; set; }
    
    public List<FilterObject> FilterObjects { get; set; } = new();
    public List<CompareObject> CompareObjects { get; set; } = new();

}

public record CompareObject
{
    public required string PropertyName { get; set; }
    public string? MoreValue  { get; set; }
    public string? LessValue  { get; set; }
}

public record FilterObject
{
    public required string PropertyName { get; set; }
    public required string Value { get; set; }
}