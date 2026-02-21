var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithPgAdmin()
    .AddDatabase("securelink-db");

var storage = builder.AddAzureStorage("storage")
    .RunAsEmulator()
    .AddBlobs("blobs");

var api = builder.AddProject<Projects.SecureLink_Api>("api")
    .WithReference(postgres)
    .WithReference(storage)
    .WaitFor(postgres)
    .WaitFor(storage)
    .WithHttpHealthCheck("/health/detailed");

var frontend = builder.AddJavaScriptApp("frontend", "../securelink-web")
    .WithCommand("dev")
    .WithHttpEndpoint(port: 3000, env: "PORT")
    .WithEnvironment("NEXT_PUBLIC_API_URL", api.GetEndpoint("http"))
    .WithEnvironment("API_URL", api.GetEndpoint("http"))
    .WithExternalHttpEndpoints();

builder.Build().Run();
