using System.Security.Cryptography;

namespace Perry.Infrastructure.Services;

/// <summary>#A12 — короткий номер заказа вида <c>#AT456BB</c>.</summary>
public static class OrderNumberGenerator
{
    private const string Letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // без I/O

    public static string Next()
    {
        Span<char> buf = stackalloc char[8];
        buf[0] = '#';
        buf[1] = Letters[RandomNumberGenerator.GetInt32(Letters.Length)];
        buf[2] = Letters[RandomNumberGenerator.GetInt32(Letters.Length)];
        buf[3] = (char)('0' + RandomNumberGenerator.GetInt32(10));
        buf[4] = (char)('0' + RandomNumberGenerator.GetInt32(10));
        buf[5] = (char)('0' + RandomNumberGenerator.GetInt32(10));
        buf[6] = Letters[RandomNumberGenerator.GetInt32(Letters.Length)];
        buf[7] = Letters[RandomNumberGenerator.GetInt32(Letters.Length)];
        return new string(buf);
    }
}
