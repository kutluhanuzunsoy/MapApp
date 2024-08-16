using MapApp.Repositories;

namespace MapApp.Data
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly MapAppDbContext context;
        private readonly Dictionary<Type, object> repositories;

        public UnitOfWork(MapAppDbContext context)
        {
            this.context = context;
            repositories = [];
        }

        public IRepository<T> GetRepository<T>() where T : class
        {
            if (repositories.ContainsKey(typeof(T)))
            {
                return (IRepository<T>)repositories[typeof(T)];
            }

            var repository = new Repository<T>(context);
            repositories.Add(typeof(T), repository);
            return repository;
        }

        public int Complete()
        {
            return context.SaveChanges();
        }

        public void Dispose()
        {
            context.Dispose();
        }
    }
}