using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using System.Linq.Expressions;

namespace QLQTDT.Api.Services;

public interface IBaseService<T> where T : class, IBaseEntity
{
    Task<PagedResult<T>> GetAllAsync(int page = 1, int pageSize = 20,
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null);
    Task<T?> GetByIdAsync(int id);
    Task<T> CreateAsync(T entity);
    Task<T> UpdateAsync(int id, T entity);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    IQueryable<T> Query();
}

public class BaseService<T> : IBaseService<T> where T : class, IBaseEntity
{
    protected readonly AppDbContext _db;
    protected readonly DbSet<T> _set;

    public BaseService(AppDbContext db)
    {
        _db = db;
        _set = db.Set<T>();
    }

    public virtual async Task<PagedResult<T>> GetAllAsync(
        int page = 1, int pageSize = 20,
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null)
    {
        var query = _set.AsQueryable();

        if (filter is not null)
            query = query.Where(filter);

        if (orderBy is not null)
            query = orderBy(query);
        else if (typeof(ISoftDeletable).IsAssignableFrom(typeof(T)))
            query = query.Where(e => !((ISoftDeletable)e).DaXoa);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<T>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public virtual async Task<T?> GetByIdAsync(int id)
    {
        var entity = await _set.FindAsync(id);
        if (entity is ISoftDeletable softDeletable && softDeletable.DaXoa)
        {
            return null;
        }
        return entity;
    }

    public virtual async Task<T> CreateAsync(T entity)
    {
        _set.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public virtual async Task<T> UpdateAsync(int id, T entity)
    {
        var existing = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy bản ghi với Id = {id}");

        _db.Entry(existing).CurrentValues.SetValues(entity);
        await _db.SaveChangesAsync();
        return existing;
    }

    public virtual async Task DeleteAsync(int id)
    {
        var entity = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy bản ghi với Id = {id}");

        if (entity is ISoftDeletable soft)
        {
            soft.DaXoa = true;
            _db.Entry(entity).Property("DaXoa").IsModified = true;
        }
        else
        {
            _set.Remove(entity);
        }

        await _db.SaveChangesAsync();
    }

    public virtual async Task<bool> ExistsAsync(int id)
    {
        if (typeof(ISoftDeletable).IsAssignableFrom(typeof(T)))
        {
            return await _set.AnyAsync(e => e.Id == id && !EF.Property<bool>(e, "DaXoa"));
        }
        return await _set.AnyAsync(e => e.Id == id);
    }

    public IQueryable<T> Query()
    {
        return _set.AsQueryable();
    }
}
