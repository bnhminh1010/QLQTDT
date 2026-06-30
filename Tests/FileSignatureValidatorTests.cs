using System.Text;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Tests.Services;

public class FileSignatureValidatorTests
{
    [Fact]
    public void Validate_PngFile_WithCorrectMagicBytes_Passes()
    {
        var bytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        using var stream = new MemoryStream(bytes);
        FileSignatureValidator.Validate("image.png", stream);
    }

    [Fact]
    public void Validate_JpgFile_WithCorrectMagicBytes_Passes()
    {
        var bytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10 };
        using var stream = new MemoryStream(bytes);
        FileSignatureValidator.Validate("photo.jpg", stream);
    }

    [Fact]
    public void Validate_PdfFile_WithCorrectMagicBytes_Passes()
    {
        var bytes = Encoding.ASCII.GetBytes("%PDF-1.4").Concat(new byte[20]).ToArray();
        using var stream = new MemoryStream(bytes);
        FileSignatureValidator.Validate("doc.pdf", stream);
    }

    [Fact]
    public void Validate_ExeRenamedToPdf_Throws()
    {
        // MZ header (EXE) disguised as .pdf
        var bytes = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00 };
        using var stream = new MemoryStream(bytes);
        Assert.Throws<QLQTDT.Api.Exceptions.BadRequestException>(() =>
            FileSignatureValidator.Validate("malware.pdf", stream));
    }

    [Fact]
    public void Validate_HtmlRenamedToTxt_WithScriptTag_Throws()
    {
        var content = "<html><script>alert('xss')</script></html>";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
        Assert.Throws<QLQTDT.Api.Exceptions.BadRequestException>(() =>
            FileSignatureValidator.Validate("notes.txt", stream));
    }

    [Fact]
    public void Validate_PlainTextFile_Passes()
    {
        var content = "Hello, world! This is a safe text file.";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
        FileSignatureValidator.Validate("hello.txt", stream);
    }

    [Fact]
    public void Validate_UnknownExtension_SkipsValidation()
    {
        var content = "<?xml version=\"1.0\"?><root></root>";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
        // .abc is unknown → skip
        FileSignatureValidator.Validate("data.abc", stream);
    }
}
