using System.Text.RegularExpressions;

namespace Perry.Domain.Utils;

public static class Helpers
{
    public static (string?, string?) GetImageTypeFromBase64(string base64)
    {
        string pattern = @"^data:(?<mime>[\w\/\-\.]+);base64,(?<data>.+)$";
        
        Match match = Regex.Match(base64, pattern);

        if (match.Success)
        {
            string mimeType = match.Groups["mime"].Value;
            string data = match.Groups["data"].Value;
            return (mimeType, data);
        }
        return (null,null);
    }
}

