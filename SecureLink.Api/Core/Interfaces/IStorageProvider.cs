namespace SecureLink.Api.Core.Interfaces;

public interface IStorageProvider
{
    Task<string> UploadAsync(Stream content, string fileName, string contentType);
    Task<Stream> DownloadAsync(string fileId);
    Task DeleteAsync(string fileId);
    string ProviderName { get; }
}
