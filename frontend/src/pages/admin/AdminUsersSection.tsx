import type { AdminUser } from '../../shared/types';

type AdminUsersSectionProps = {
  loading: boolean;
  error: string;
  users: AdminUser[];
};

export function AdminUsersSection(props: AdminUsersSectionProps) {
  const { loading, error, users } = props;

  return (
    <>
      <section className="mb-4">
        <h1 className="h3 mb-1">Users</h1>
        <p className="text-secondary mb-0">Registered users and assigned roles.</p>
      </section>

      {loading && <div className="alert alert-info">Loading users...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <section className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>
                        <span
                          className={`badge ${
                            user.role === 'ADMIN' ? 'text-bg-dark' : 'text-bg-secondary'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleString()}</td>
                      <td>{new Date(user.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-secondary">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
