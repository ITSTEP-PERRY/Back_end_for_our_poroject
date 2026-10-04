using System.Security.Claims;
using Perry.Api.Auth;

namespace Perry.Tests;

public class AuthClaimsTests
{
    [Fact]
    public void GetUserId_reads_sub_claim()
    {
        var id = Guid.NewGuid();
        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("sub", id.ToString()),
            new Claim("role", "User")
        ], "Bearer"));

        Assert.Equal(id, AuthClaims.GetUserId(user));
        Assert.Equal("User", AuthClaims.GetRole(user));
    }

    [Fact]
    public void GetUserId_returns_null_without_claims()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity());
        Assert.Null(AuthClaims.GetUserId(user));
    }
}
