import { QueueEmailsOperation, QueueMailPayload } from '@common/types/queue.type';
import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as matter from 'gray-matter';
import Handlebars from 'handlebars';

@Injectable()
export class MailerTemplateService {
  private readonly emailsRootPath: string;

  constructor() {
    this.emailsRootPath = path.join(__dirname, '../../../emails');
  }

  async compileTemplate<T extends QueueEmailsOperation>(
    templateKey: T,
    templateData: T extends QueueEmailsOperation.InviteUser
      ? QueueMailPayload<T>['params'][number]
      : never,
  ) {
    // : Promise<{ html: string; text: string; subject: string }>
    const rawTemplate = this.getRawTemplate(templateKey);
    const { title, text } = this.getTemplateMeta(rawTemplate);

    const Maizzle = await import('@maizzle/framework');
    const { html, config } = await Maizzle.render(rawTemplate, {
      tailwind: {
        config: await this.getTailwindConfig(),
        css: this.getBaseMaizzleCss(),
      },
      maizzle: {
        prettify: true,
        build: {
          components: {
            root: path.join(this.emailsRootPath),
          },
        },
        markdown: {
          plugins: [{ plugin: require('markdown-it-attrs') }],
        },
      },
      beforeRender(html) {
        const { content, data } = matter(html);
        const layout = data?.layout || 'main';

        return `
          <x-${layout}>
            <fill:template>
              <md>${content}</md>
            </fill:template>
          </x-${layout}>`;
      },
    });

    const renderedHtml = this.renderHandlebars(html, templateData);
    fs.writeFileSync(
      path.join(this.emailsRootPath, `src/content/${templateKey}.html`),
      renderedHtml,
      'utf8',
    );

    return {
      html: this.renderHandlebars(html, templateData),
      text: this.renderHandlebars(text || 'ERROR: TEXT COULD NOT BE RENDERED', templateData),
      subject: this.renderHandlebars(title || 'ERROR: TITLE COULD NOT BE RENDERED', templateData),
      twConfig: await this.getTailwindConfig(),
    };
  }

  private async getTailwindConfig() {
    return (await import(path.join(this.emailsRootPath, 'tailwind.config.js'))).default;
  }

  private getRawTemplate(templateKey: QueueEmailsOperation) {
    return fs.readFileSync(path.join(this.emailsRootPath, `src/content/${templateKey}.md`), 'utf8');
  }

  private getTemplateMeta(rawTemplate: string): Record<string, string> {
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
    const utilities = fs.readFileSync(
      path.join(this.emailsRootPath, 'src/css/utilities.css'),
      'utf8',
    );

    return `
    ${markdown}
    ${utilities}`;
  }
}
