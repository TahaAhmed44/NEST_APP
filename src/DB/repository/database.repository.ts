import {
  CreateOptions,
  DeleteResult,
  FlattenMaps,
  HydratedDocument,
  Model,
  MongooseUpdateQueryOptions,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
  Types,
  UpdateQuery,
  UpdateWriteOpResult,
} from 'mongoose';

export type Lean<T> = FlattenMaps<T>;

export abstract class DatabaseRepository<
  TRawDocument,
  TDocument = HydratedDocument<TRawDocument>,
> {
  protected constructor(protected model: Model<TDocument>) {}

  async find({
    filter,
    select,
    options,
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    select?: ProjectionType<TRawDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }): Promise<Lean<TDocument>[] | TDocument[] | []> {
    const doc = this.model.find(filter || {}).select(select || '');
    if (options?.lean) {
      doc.lean(options.lean);
    }
    if (options?.skip) {
      doc.skip(options.skip);
    }
    if (options?.limit) {
      doc.limit(options.limit);
    }
    return await doc.exec();
  }

  async findOne({
    filter,
    select,
    options,
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    select?: ProjectionType<TRawDocument> | null;
    options?:
      | (QueryOptions<TDocument> & {
          populate?: string | PopulateOptions | (string | PopulateOptions)[];
        })
      | null;
  }): Promise<Lean<TDocument> | TDocument | null> {
    const doc = this.model.findOne(filter).select(select || '');

    if (options?.lean) {
      doc.lean(options.lean);
    }

    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions);
    }

    return await doc.exec();
  }

  async findById({
    id,
    select,
    options,
  }: {
    id: Types.ObjectId;
    select?: ProjectionType<TRawDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }): Promise<Lean<TDocument> | TDocument | null> {
    const doc = this.model.findById(id).select(select || '');
    if (options?.lean) {
      doc.lean(options.lean);
    }
    return await doc.exec();
  }

  async create({
    data,
    options,
  }: {
    data: Partial<TRawDocument>[];
    options?: CreateOptions;
  }): Promise<TDocument[]> {
    return (await this.model.create(data, options)) || [];
  }

  async insertMany({
    data,
  }: {
    data: Partial<TDocument>[];
  }): Promise<TDocument[]> {
    return await this.model.insertMany(data as TDocument[]);
  }

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: RootFilterQuery<TRawDocument>;
    update: UpdateQuery<TDocument>;
    options?: MongooseUpdateQueryOptions<TDocument> | null;
  }): Promise<UpdateWriteOpResult> {
    return await this.model.updateOne(
      filter,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }

  async deleteOne({
    filter,
  }: {
    filter: RootFilterQuery<TRawDocument>;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }

  async findOneAndDelete({
    filter,
  }: {
    filter: RootFilterQuery<TRawDocument>;
  }): Promise<TDocument | null> {
    return await this.model.findOneAndDelete(filter);
  }

  async deleteMany({
    filter,
  }: {
    filter: RootFilterQuery<TRawDocument>;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter);
  }

  async findByIdAndUpdate({
    id,
    update,
    options = { new: true },
  }: {
    id: Types.ObjectId;
    update?: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument> | null;
  }): Promise<TDocument | Lean<TDocument> | null> {
    return await this.model.findByIdAndUpdate(
      id,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }

  async findOneAndUpdate({
    filter,
    update,
    options = { new: true },
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    update?: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument> | null;
  }): Promise<TDocument | Lean<TDocument> | null> {
    return await this.model.findOneAndUpdate(
      filter,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  }
}
