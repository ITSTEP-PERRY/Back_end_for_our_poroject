using Perry.Infrastructure.Services;
using Perry.Tests.Helpers;

namespace Perry.Tests;

public class PasswordResetServiceTests
{
    [Fact]
    public void CreateToken_GetEmail_then_Invalidate()
    {
        using var fx = new TestDb();
        var reset = new PasswordResetService(fx.Db);

        var token = reset.CreateToken("Buyer@Perry.dev");
        Assert.Equal("buyer@perry.dev", reset.GetEmail(token));

        reset.Invalidate(token);
        Assert.Null(reset.GetEmail(token));
    }
}
