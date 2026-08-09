namespace AlchemyStudio.Api.Orders;

// Fully snapshotted at order time -- ProductId is kept for reference/lookups
// only. Name/price must never change retroactively just because the
// product listing changed or was deleted later.
//
// ProductId is nullable: a custom-order item (CustomOrders/CustomOrderService)
// has no real catalog Product behind it -- ProductName/PriceInPaise are still
// fully snapshotted, there's just nothing to look up. OrderService's
// stock-decrement logic skips items with a null ProductId accordingly.
public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid? ProductId { get; set; }
    public required string ProductName { get; set; }
    public required long PriceInPaise { get; set; }
    public required int Quantity { get; set; }
    public required long LineTotalInPaise { get; set; }
}
