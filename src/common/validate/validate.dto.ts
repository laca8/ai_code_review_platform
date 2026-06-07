import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export const validateDto = (dto: any) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const output = plainToInstance(dto, req.body);

            const errors = await validate(output);

            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    errors: errors.map((err) => ({
                        field: err.property,
                        constraints: err.constraints,
                    })),
                });
            }

            req.body = output;

            next();
        } catch (error) {
            console.log('error', error);

            next(error);
        }
    };
};