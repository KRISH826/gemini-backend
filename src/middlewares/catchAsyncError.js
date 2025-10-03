export const catchAsyncErrors = (asynvFunction) => {
    return (req,res,next) => {
        Promise.resolve(asynvFunction(req,res,next)).catch(next);
    }
}