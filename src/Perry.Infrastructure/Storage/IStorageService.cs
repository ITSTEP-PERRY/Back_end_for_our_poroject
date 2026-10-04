using Microsoft.AspNetCore.Http;

namespace Perry.Infrastructure.Storage;

/// <summary>Сохранение загруженных изображений на диск (из homework DiskStorageService).</summary>
public interface IStorageService
{
    /// <summary>Сохраняет файл; возвращает публичный путь вида <c>/uploads/{guid}.ext</c>.</summary>
    string Save(IFormFile formFile);

    /// <summary>Сохраняет data-URL (base64); возвращает <c>/uploads/...</c>.</summary>
    string SaveDataUrl(string dataUrl);

    byte[] Load(string filename);
}
