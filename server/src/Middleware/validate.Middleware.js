export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false })
        console.log(value);

        if (error) {
            const errors = error.details.map(detail => detail.message)
            console.log(errors);
            return res.status(400).json({ message: errors, success: false })
        }
        req.body = value
        next()
    }
}