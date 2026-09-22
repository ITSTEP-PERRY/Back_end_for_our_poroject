namespace Perry.Domain.Primitives;

public class Result
{
    public bool Succeeded { get; }
    public bool Failed => !Succeeded;
    public Error? Error { get; } = null;

    protected Result(bool succeeded, Error? error)
    {
        if (succeeded && error != null
            || !succeeded && error == Error.None)
        {
            throw new ArgumentException("Invalid error", nameof(error));
        }

        Succeeded = succeeded;
        Error = error;
    }

    public static Result Success() => new(true, null);
    public static Result Failure(Error error) => new(false, error);
    public static implicit operator bool(Result result) => result.Succeeded;
}

public class Result<TResult> : Result
{
    protected Result(bool succeeded, TResult? value, Error? error) : base(succeeded, error)
    {
        Value = value;
    }

    public TResult? Value { get; }
    public static Result<TResult> Success(TResult value) => new(true, value, null);
    public static Result<TResult> Failure(TResult? value, Error? error) => new(false, value, error);
    public static implicit operator bool(Result<TResult> result) => result.Succeeded;

    /// <summary>
    /// Converting Result<TResult> object implicitly to Result object;
    /// Before:
    ///         return Result<TResult>.Success(value);
    /// After:
    ///         return value; 
    /// </summary>
    /// <param name="result"></param>
    /// <returns>Result Success Result</returns>
    public static implicit operator Result<TResult>(TResult? result)
    {
        if (result != null) return Result<TResult>.Success(result);
        return Result<TResult>.Failure(default, null);
    }

    public static implicit operator Result<TResult>(Error? error) => Result<TResult>.Failure(default, error);
}