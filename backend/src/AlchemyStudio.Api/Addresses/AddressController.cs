using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlchemyStudio.Api.Addresses;

// Login required -- addresses only exist for accounts (docs/decisions.md).
[ApiController]
[Route("api/v1/addresses")]
[Authorize]
public class AddressController(AddressService addressService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AddressDto>>> List() => Ok(await addressService.GetForUserAsync(CurrentUserId));

    [HttpPost]
    public async Task<ActionResult<AddressDto>> Create(AddressRequest request) =>
        Ok(await addressService.CreateAsync(CurrentUserId, request));

    [HttpPut("{id}")]
    public async Task<ActionResult<AddressDto>> Update(Guid id, AddressRequest request) =>
        Ok(await addressService.UpdateAsync(CurrentUserId, id, request));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await addressService.DeleteAsync(CurrentUserId, id);
        return NoContent();
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
}
