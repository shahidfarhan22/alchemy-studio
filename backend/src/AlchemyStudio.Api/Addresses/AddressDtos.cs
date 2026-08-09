namespace AlchemyStudio.Api.Addresses;

public record AddressDto(
    Guid Id,
    string FullName,
    string Line1,
    string? Line2,
    string City,
    string State,
    string PostalCode,
    string Country,
    string Phone,
    bool IsDefault
);

public record AddressRequest(
    string FullName,
    string Line1,
    string? Line2,
    string City,
    string State,
    string PostalCode,
    string Phone,
    bool IsDefault
);
