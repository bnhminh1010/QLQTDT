using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using QLQTDT.Api.Models;

namespace QLQTDT.Api.Helpers;

/// <summary>
/// Action Filter tự động validate request body bằng FluentValidation.
/// Nếu có validator đã đăng ký cho kiểu dữ liệu của action parameter,
/// sẽ tự động validate và trả 400 nếu có lỗi — không cần gọi thủ công.
/// </summary>
public class ValidationFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null) continue;

            var argumentType = argument.GetType();
            var validatorType = typeof(IValidator<>).MakeGenericType(argumentType);
            var validator = context.HttpContext.RequestServices.GetService(validatorType) as IValidator;

            if (validator is null) continue;

            var validationContext = new ValidationContext<object>(argument);
            var result = await validator.ValidateAsync(validationContext);

            if (!result.IsValid)
            {
                var errors = result.Errors
                    .Select(e => new ErrorDetail
                    {
                        Field = e.PropertyName,
                        Message = e.ErrorMessage
                    })
                    .ToList();

                context.Result = new BadRequestObjectResult(
                    ApiResponse<object>.Fail("Dữ liệu không hợp lệ", errors));
                return;
            }
        }

        await next();
    }
}
