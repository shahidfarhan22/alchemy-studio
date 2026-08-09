using AlchemyStudio.Api.Data;
using AlchemyStudio.Api.ErrorHandling;
using Microsoft.EntityFrameworkCore;

namespace AlchemyStudio.Api.Addresses;

public class AddressService(AppDbContext db)
{
    public async Task<List<AddressDto>> GetForUserAsync(Guid userId) =>
        await db.Addresses.Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.CreatedAt)
            .Select(a => ToDto(a))
            .ToListAsync();

    public async Task<AddressDto> CreateAsync(Guid userId, AddressRequest request)
    {
        Validate(request);

        var address = new Address
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FullName = request.FullName,
            Line1 = request.Line1,
            Line2 = request.Line2,
            City = request.City,
            State = request.State,
            PostalCode = request.PostalCode,
            Phone = request.Phone,
            IsDefault = request.IsDefault,
        };

        if (request.IsDefault)
        {
            await ClearExistingDefaultAsync(userId);
        }

        db.Addresses.Add(address);
        await db.SaveChangesAsync();
        return ToDto(address);
    }

    public async Task<AddressDto> UpdateAsync(Guid userId, Guid id, AddressRequest request)
    {
        Validate(request);

        var address = await db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId)
            ?? throw new ApiException("ADDRESS_NOT_FOUND", "Address not found.", 404);

        if (request.IsDefault && !address.IsDefault)
        {
            await ClearExistingDefaultAsync(userId);
        }

        address.FullName = request.FullName;
        address.Line1 = request.Line1;
        address.Line2 = request.Line2;
        address.City = request.City;
        address.State = request.State;
        address.PostalCode = request.PostalCode;
        address.Phone = request.Phone;
        address.IsDefault = request.IsDefault;

        await db.SaveChangesAsync();
        return ToDto(address);
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var address = await db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId)
            ?? throw new ApiException("ADDRESS_NOT_FOUND", "Address not found.", 404);

        db.Addresses.Remove(address);
        await db.SaveChangesAsync();
    }

    private async Task ClearExistingDefaultAsync(Guid userId)
    {
        var current = await db.Addresses.Where(a => a.UserId == userId && a.IsDefault).ToListAsync();
        foreach (var a in current) a.IsDefault = false;
    }

    private static void Validate(AddressRequest request)
    {
        var details = new List<ErrorDetail>();
        if (string.IsNullOrWhiteSpace(request.FullName)) details.Add(new ErrorDetail("fullName", "required"));
        if (string.IsNullOrWhiteSpace(request.Line1)) details.Add(new ErrorDetail("line1", "required"));
        if (string.IsNullOrWhiteSpace(request.City)) details.Add(new ErrorDetail("city", "required"));
        if (string.IsNullOrWhiteSpace(request.State)) details.Add(new ErrorDetail("state", "required"));
        if (string.IsNullOrWhiteSpace(request.PostalCode)) details.Add(new ErrorDetail("postalCode", "required"));
        if (string.IsNullOrWhiteSpace(request.Phone)) details.Add(new ErrorDetail("phone", "required"));

        if (details.Count > 0)
        {
            throw new ApiException("VALIDATION_FAILED", "One or more fields are invalid.", 400, details);
        }
    }

    private static AddressDto ToDto(Address a) => new(
        a.Id, a.FullName, a.Line1, a.Line2, a.City, a.State, a.PostalCode, a.Country, a.Phone, a.IsDefault);
}
