namespace AlchemyStudio.Api.Orders;

// Fully snapshotted at order time -- ProductId is kept for reference/lookups
// only. Name/price must never change retroactively just because the
// product listing changed or was deleted later.
public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public required Guid ProductId { get; set; }
    public required string ProductName { get; set; }
    public required long PriceInPaise { get; set; }
    public required int Quantity { get; set; }
    public required long LineTotalInPaise { get; set; }
}
