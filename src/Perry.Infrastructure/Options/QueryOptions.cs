namespace Perry.Infrastructure.Options;

/// <summary>
/// Parameters for pagination, sorting, and filtering data.
/// </summary>
public class QueryOptions
{
    public int CurrentPage { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public string? OrderPropertyName { get; set; }
    public bool DescendingOrder { get; set; }
    public string? SearchPropertyName { get; set; }
    public string? SearchTerm { get; set; }
    public string? FilterPropertyName { get; set; }
    public string? FilterPropertyValue { get; set; }
}