using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Perry.Domain.Utils;

namespace Perry.Infrastructure.Storage;

/// <summary>
/// Файлы кладутся в wwwroot/uploads/ с GUID-именем.
/// Путь резолвится относительно ContentRoot веб-приложения.
/// </summary>
public class DiskStorageService : IStorageService
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    private static readonly Dictionary<string, string> MimeToExt = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/jpg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/gif"] = ".gif",
        ["image/webp"] = ".webp",
        ["image/bmp"] = ".bmp",
    };
    private const long MaxFileSize = 5 * 1024 * 1024;

    private readonly string _storagePath;

    public DiskStorageService(IHostEnvironment env)
    {
        _storagePath = Path.Combine(env.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(_storagePath);
    }

    public byte[] Load(string filename)
    {
        if (string.IsNullOrWhiteSpace(filename))
            throw new ArgumentException("Empty file name", nameof(filename));

        var name = filename.Replace('\\', '/');
        if (name.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
            name = name["/uploads/".Length..];
        else if (name.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
            name = name["uploads/".Length..];

        var path = Path.Combine(_storagePath, Path.GetFileName(name));
        if (!File.Exists(path))
            throw new FileNotFoundException();

        return File.ReadAllBytes(path);
    }

    public string Save(IFormFile formFile)
    {
        ArgumentNullException.ThrowIfNull(formFile);

        if (formFile.Length == 0)
            throw new ArgumentException("File is empty", nameof(formFile));

        if (formFile.Length > MaxFileSize)
            throw new ArgumentException("File too large (max 5MB)", nameof(formFile));

        var ext = Path.GetExtension(formFile.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
            throw new ArgumentException($"Extension '{ext}' is not allowed", nameof(formFile));

        var saveName = Guid.NewGuid() + ext;
        var savePath = Path.Combine(_storagePath, saveName);

        using var stream = File.Create(savePath);
        formFile.CopyTo(stream);

        return "/uploads/" + saveName;
    }

    public string SaveDataUrl(string dataUrl)
    {
        if (string.IsNullOrWhiteSpace(dataUrl))
            throw new ArgumentException("Empty data URL", nameof(dataUrl));

        var (mime, data) = Helpers.GetImageTypeFromBase64(dataUrl.Trim());
        if (mime is null || data is null)
            throw new ArgumentException("Invalid image data URL", nameof(dataUrl));

        if (!MimeToExt.TryGetValue(mime, out var ext) || !AllowedExtensions.Contains(ext))
            throw new ArgumentException($"MIME '{mime}' is not allowed", nameof(dataUrl));

        if (data.Contains(','))
            data = data.Split(',')[1];

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(data);
        }
        catch (FormatException ex)
        {
            throw new ArgumentException("Invalid base64 image data", nameof(dataUrl), ex);
        }

        if (bytes.Length == 0)
            throw new ArgumentException("File is empty", nameof(dataUrl));
        if (bytes.Length > MaxFileSize)
            throw new ArgumentException("File too large (max 5MB)", nameof(dataUrl));

        var saveName = Guid.NewGuid() + ext;
        var savePath = Path.Combine(_storagePath, saveName);
        File.WriteAllBytes(savePath, bytes);
        return "/uploads/" + saveName;
    }
}
