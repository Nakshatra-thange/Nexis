// import { ZodSchema } from "zod";
// import { Request, Response, NextFunction } from "express";

// export const validate =
//   (schema: ZodSchema) =>
//   (req: Request, res: Response, next: NextFunction) => {
//     const result = schema.safeParse({
//       body: req.body,
//       params: req.params,
//       query: req.query,
//     });

//     if (!result.success) {
//       return res.status(400).json({
//         error: "INVALID_REQUEST",
//         message: result.error.errors[0].message,
//       });
//     }

//     next();
//   };
