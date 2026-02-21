using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using SecureLink.Api.Core.Interfaces;

namespace SecureLink.Api.Infrastructure.Storage;

public class AzureBlobStorageProvider : IStorageProvider
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _containerName;

    public AzureBlobStorageProvider(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("blobs")
            ?? configuration["Storage:AzureBlob:ConnectionString"]
            ?? throw new ArgumentNullException("connectionString", "Blob storage connection string not found. Expected 'ConnectionStrings:blobs' (Aspire) or 'Storage:AzureBlob:ConnectionString'.");
        _containerName = configuration["Storage:AzureBlob:ContainerName"] ?? "files";

        _blobServiceClient = new BlobServiceClient(connectionString);
        
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        containerClient.CreateIfNotExists(PublicAccessType.None);
    }

    public string ProviderName => "AzureBlob";

    public async Task<string> UploadAsync(Stream content, string fileName, string contentType)
    {
        var fileId = Guid.NewGuid().ToString();
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(fileId);

        var blobHttpHeaders = new BlobHttpHeaders
        {
            ContentType = contentType
        };

        await blobClient.UploadAsync(content, new BlobUploadOptions
        {
            HttpHeaders = blobHttpHeaders
        });

        return fileId;
    }

    public async Task<Stream> DownloadAsync(string fileId)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(fileId);

        if (!await blobClient.ExistsAsync())
        {
            throw new FileNotFoundException($"Blob {fileId} not found");
        }

        var response = await blobClient.DownloadStreamingAsync();
        return response.Value.Content;
    }

    public async Task DeleteAsync(string fileId)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(fileId);
        await blobClient.DeleteIfExistsAsync();
    }
}
