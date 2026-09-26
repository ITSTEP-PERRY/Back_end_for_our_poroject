using Azure.Core;
using Microsoft.AspNetCore.Mvc;

namespace Perry.Api.Utils;

public static class ApiHelpers
{
    public static string GetImageUrl(HttpRequest request, string? urlHelper, string url)
    {
        if(url.StartsWith("http")) return url;

        return request.Scheme + "://" + request.Host.Value + urlHelper;
    }
}