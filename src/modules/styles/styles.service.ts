import { Injectable } from '@nestjs/common';
import { StylesRepository } from './styles.repository';
import { StyleRecord } from './styles.types';

@Injectable()
export class StylesService {
  constructor(private readonly repo: StylesRepository) {}

  async findAll(): Promise<StyleRecord[]> {
    return this.repo.findAll();
  }
}
