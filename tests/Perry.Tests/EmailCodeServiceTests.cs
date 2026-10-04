using Perry.Infrastructure.Services;
using Perry.Tests.Helpers;

namespace Perry.Tests;

public class EmailCodeServiceTests
{
    [Fact]
    public void Generate_and_TryVerify_one_time_code()
    {
        using var fx = new TestDb();
        var codes = new EmailCodeService(fx.Db);

        var code = codes.GenerateCode("User@Example.com");
        Assert.True(codes.Matches("user@example.com", code));
        Assert.True(codes.TryVerify("user@example.com", code));
        Assert.False(codes.Matches("user@example.com", code));
    }
}
