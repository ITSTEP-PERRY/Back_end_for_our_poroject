using Microsoft.AspNetCore.Mvc;

namespace Perry.Api.Utils;

public static class ApiHelpers
{
    public static string GetImageUrl(HttpRequest request, string? urlHelper, string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return url ?? "";
        if (url.StartsWith("http", StringComparison.OrdinalIgnoreCase)) return url;
        if (url.StartsWith("data:", StringComparison.OrdinalIgnoreCase)) return url;
        if (url.StartsWith("/uploads", StringComparison.OrdinalIgnoreCase))
            return $"{request.Scheme}://{request.Host.Value}{url}";

        return request.Scheme + "://" + request.Host.Value + urlHelper;
    }
}
