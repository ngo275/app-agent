import Handlebars from 'handlebars';

export class TemplateManager<TData> {
  private compiledTemplate: HandlebarsTemplateDelegate<TData>;

  constructor(template: string) {
    try {
      this.compiledTemplate = Handlebars.compile<TData>(template, {
        noEscape: true,
      });
    } catch (error) {
      throw new Error(`Failed to compile template: ${error}`);
    }
  }

  render(data: TData): string {
    return this.compiledTemplate(data);
  }
}
