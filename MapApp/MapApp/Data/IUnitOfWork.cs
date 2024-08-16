using MapApp.Repositories;

namespace MapApp.Data
{
    public interface IUnitOfWork : IDisposable
    {
        IRepository<T> GetRepository<T>() where T : class;
        int Complete();
    }
}