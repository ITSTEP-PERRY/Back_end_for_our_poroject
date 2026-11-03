# Perry — Stage 7 Kubernetes Security

## Environment

- Kubernetes: Docker Desktop
- Namespace: perry-stage7
- Database: PostgreSQL 16
- Storage: 5 GiB PVC, StorageClass standard
- Network: Kindnet with tested NetworkPolicy enforcement

## Files

- namespace.yaml — isolated namespace
- postgres.yaml — PostgreSQL Service and StatefulSet
- postgres-networkpolicy.yaml — database ingress restrictions

## Deployment order

1. Create the namespace:
   kubectl apply -f k8s/stage7/namespace.yaml

2. Create the Kubernetes Secret perry-postgres-credentials
   with these keys:
   POSTGRES_DB=perry_stage7
   POSTGRES_USER=perry_stage
   POSTGRES_PASSWORD=<random-secret>
   ConnectionStrings__DefaultConnection=<connection-string>

   Do not commit actual passwords or Secret manifests.

3. Deploy PostgreSQL:
   kubectl apply -f k8s/stage7/postgres.yaml

4. Wait for readiness:
   kubectl rollout status statefulset/perry-postgres -n perry-stage7

5. Create the perry_api database role with:
   LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE,
   NOREPLICATION and NOBYPASSRLS.

   Grant CONNECT on perry_stage7 and USAGE, CREATE
   on schema public. Use a separate random password.

6. Create Secret perry-api-db-credentials containing:
   ConnectionStrings__DefaultConnection
   POSTGRES_APP_USER
   POSTGRES_APP_PASSWORD

7. Deploy the NetworkPolicy:
   kubectl apply -f k8s/stage7/postgres-networkpolicy.yaml

## Security

- PostgreSQL runs as UID/GID 70, without root.
- Privilege escalation is disabled.
- All Linux capabilities are dropped.
- RuntimeDefault seccomp profile is enabled.
- Automatic ServiceAccount token mounting is disabled.
- Password authentication uses SCRAM-SHA-256.
- The API has a separate non-superuser database role.
- NetworkPolicy allows TCP/5432 from app=perry-api
  and app=perry-db-maintenance in the same namespace.

Database role creation and Secret generation must be
automated before this becomes a fully reproducible deployment.

## Verified tests

- PostgreSQL startup: PASS
- Passwordless connection rejected: PASS
- Password authentication: PASS
- Non-root execution: PASS
- API database permissions: PASS
- PVC persistence after Pod recreation: PASS
- PostgreSQL custom-format backup: PASS
- Restore into a separate test database: PASS
- NetworkPolicy allowed client: PASS
- NetworkPolicy denied client: PASS

## Backup and Restore

Test backup: PostgreSQL pg_dump custom format (-Fc).

Backup exported outside Kubernetes to the Windows
PerryBackups directory.

Restore was verified using pg_restore into
perry_stage7_restore_test.

Validation record:
PERRY_STAGE7_PVC_OK

The backup covers the test database, not PostgreSQL
global roles, Kubernetes Secrets or other cluster resources.

## Important limitations

- This is a local single-node Kubernetes environment.
- Local-path PVC storage does not protect against node failure.
- Backups must be stored outside Kubernetes.
- Existing PVC contents are not reinitialized when
  POSTGRES_INITDB_ARGS changes.
- Authentication and user-management services are not
  yet integrated into the new application deployment.
- The existing namespace perry must not be modified
  during Stage 7 testing.
