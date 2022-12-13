import { QueueEmailsOperation, QueueMailPayload } from '@common/types/queue.type';
import { Injectable } from '@nestjs/common';
import Maizzle from '@maizzle/framework';
import * as path from 'path';
import * as fs from 'fs';
import Handlebars from 'handlebars';

@Injectable()
export class MailerService {
  private readonly emailsRootPath: string;

  constructor() {
    this.emailsRootPath = path.join(__dirname, '../../../emails');
  }

  async compileTemplate<T extends QueueEmailsOperation>(
    templateKey: T,
    templateData: T extends QueueEmailsOperation.InviteUser
      ? QueueMailPayload<T>['params'][number]
      : never,
  ): Promise<{ html: string; text: string; subject: string }> {
    const rawTemplate = this.getRawTemplate(templateKey);
    const { title, text } = this.getTemplateMeta(rawTemplate) as Record<string, string>;

    const renderedRawTemplate = await Maizzle.render(rawTemplate, {
      tailwind: {
        config: await this.getTailwindConfig(),
        css: this.getBaseMaizzleCss(),
      },
      maizzle: {
        inlineCSS: true,
        shorthandCSS: true,
        removeUnusedCSS: true,
        prettify: true,
      },
    });
    return {
      html: this.renderHandlebars(renderedRawTemplate, templateData),
      text: this.renderHandlebars(text || 'ERROR: TEXT COULD NOT BE RENDERED', templateData),
      subject: this.renderHandlebars(title || 'ERROR: TITLE COULD NOT BE RENDERED', templateData),
    };
  }

  private async getTailwindConfig() {
    return await import(path.join(this.emailsRootPath, 'tailwind.config.js'));
  }

  private getRawTemplate(templateKey: QueueEmailsOperation) {
    return fs.readFileSync(path.join(this.emailsRootPath, `src/content/${templateKey}.md`), 'utf8');
  }

  private getTemplateMeta(rawTemplate: string) {
    if (!rawTemplate.startsWith('---')) return {};
    const [_, meta] = rawTemplate.split('---');
    const metaObject = meta
      .split('\n')
      .filter((line) => line)
      .reduce((acc, line) => {
        const [key, value] = line.split(':');
        return { ...acc, [key]: value };
      }, {});
    return metaObject;
  }

  private renderHandlebars(templateString: string, templateData: { [key: string]: any }) {
    return Handlebars.compile(templateString)(templateData);
  }

  private getBaseMaizzleCss() {
    const markdown = fs.readFileSync(
      path.join(this.emailsRootPath, 'src/css/markdown.css'),
      'utf8',
    );
    const tailwind = fs.readFileSync(
      path.join(this.emailsRootPath, 'src/css/tailwind.css'),
      'utf8',
    );
    const utilities = fs.readFileSync(
      path.join(this.emailsRootPath, 'src/css/utilities.css'),
      'utf8',
    );

    return [markdown, tailwind, utilities].join('\n');
  }
}
