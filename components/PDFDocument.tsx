import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ChapterReport, FormData } from '../types';
import { lexer } from 'marked';

// NOTE: We are using standard PDF fonts (Helvetica, Times-Roman) to ensure reliable generation
// without "Unknown font format" errors caused by fetching remote fonts in this environment.

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FAFAF9',
    fontFamily: 'Helvetica',
    color: '#44403C',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
    paddingBottom: 10,
  },
  brandName: {
    fontFamily: 'Times-Roman',
    fontSize: 14,
    color: '#1C1917',
    fontWeight: 'bold',
  },
  brandSub: {
    fontSize: 8,
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  meta: {
    fontSize: 9,
    color: '#78716C',
    textAlign: 'right',
  },
  chapterTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 28,
    color: '#1C1917',
    marginBottom: 15,
    lineHeight: 1.1,
  },
  sectionTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 16,
    color: '#1C1917',
    marginTop: 20,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#B45309',
    paddingLeft: 8,
    fontWeight: 'bold',
  },
  text: {
    marginBottom: 6,
    color: '#44403C',
    fontFamily: 'Helvetica',
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
    // Removed fontFamily to allow inheritance (fixes Bold + Italic font resolution)
    color: '#1C1917',
  },
  italic: {
    fontStyle: 'italic',
    // Removed fontFamily to allow inheritance
  },
  // Teacher's Insight Box
  insightBox: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#B45309',
    marginTop: 15,
    marginBottom: 15,
  },
  insightTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    color: '#B45309',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  insightText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#57534E',
    lineHeight: 1.5,
  },
  // Concept
  conceptBox: {
    marginBottom: 12,
  },
  conceptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  conceptNumber: {
    fontSize: 10,
    color: '#A8A29E',
    marginRight: 6,
    fontWeight: 'bold',
  },
  conceptTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    color: '#1C1917',
    fontWeight: 'bold',
  },
  // Definitions
  defItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F5F5F4',
    borderRadius: 4,
  },
  defTerm: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: '#1C1917',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  // Formulas
  codeBlock: {
    backgroundColor: '#292524',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  codeText: {
    color: '#D6D3D1',
    fontFamily: 'Courier', 
    fontSize: 9,
  },
  // Citations
  citationBox: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
  },
  citationItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  citationBullet: {
    width: 15,
    fontSize: 8,
    color: '#B45309',
    fontWeight: 'bold',
  },
  citationText: {
    flex: 1,
    fontSize: 8,
    color: '#57534E',
  },
  // Markdown specific
  mdHeading1: { fontSize: 16, fontFamily: 'Times-Roman', fontWeight: 'bold', marginTop: 10, marginBottom: 6 },
  mdHeading2: { fontSize: 14, fontFamily: 'Times-Roman', fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
  mdHeading3: { fontSize: 12, fontFamily: 'Times-Roman', fontWeight: 'bold', marginTop: 6, marginBottom: 4 },
  listItem: { flexDirection: 'row', marginBottom: 2 },
  bullet: { width: 10, marginRight: 2, fontSize: 10, color: '#44403C' },
});

// Helper to render inline tokens (bold, italic, code, link)
const renderInlineTokens = (tokens: any[]): React.ReactNode[] => {
    return tokens.map((t, i) => {
        if (t.type === 'strong') {
            return (
                <Text key={i} style={styles.bold}>
                    {t.tokens ? renderInlineTokens(t.tokens) : t.text}
                </Text>
            );
        }
        if (t.type === 'em') {
             return (
                <Text key={i} style={styles.italic}>
                    {t.tokens ? renderInlineTokens(t.tokens) : t.text}
                </Text>
            );
        }
        if (t.type === 'codespan') return <Text key={i} style={{ fontFamily: 'Courier', backgroundColor: '#e5e5e5' }}>{t.text}</Text>;
        if (t.type === 'link') return <Text key={i} style={{ color: '#B45309', textDecoration: 'none' }}>{t.text}</Text>;
        
        // Handle nested structure if 'marked' produces it for other types, otherwise fallback to text
        if (t.tokens) {
            return renderInlineTokens(t.tokens);
        }

        return <Text key={i}>{t.text}</Text>;
    });
};

// Robust Markdown Renderer for PDF
const Markdown = ({ children, style, textStyle }: { children: string, style?: any, textStyle?: any }) => {
  if (!children) return null;
  
  // Use marked.lexer to get tokens
  const tokens = lexer(children);

  return (
    <View style={style}>
      {tokens.map((token: any, index: number) => {
        // Heading
        if (token.type === 'heading') {
            const headingStyle = token.depth === 1 ? styles.mdHeading1 : token.depth === 2 ? styles.mdHeading2 : styles.mdHeading3;
            return <Text key={index} style={[styles.text, headingStyle, textStyle]}>{token.text}</Text>;
        }
        
        // Paragraph
        if (token.type === 'paragraph') {
          return (
            <View key={index} style={{ marginBottom: 4 }}>
              <Text style={[styles.text, textStyle]}>
                  {token.tokens ? renderInlineTokens(token.tokens) : token.text}
              </Text>
            </View>
          );
        }

        // List
        if (token.type === 'list') {
            return (
                <View key={index} style={{ marginBottom: 6, marginLeft: 4 }}>
                    {token.items.map((item: any, i: number) => (
                        <View key={i} style={styles.listItem}>
                            <Text style={styles.bullet}>•</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.text, textStyle]}>
                                    {/* List items often wrap content in 'tokens' -> 'text' -> 'tokens' */}
                                    {item.tokens 
                                      ? item.tokens.map((t:any, k:number) => {
                                           if (t.type === 'text') {
                                               return t.tokens ? renderInlineTokens(t.tokens) : t.text;
                                           }
                                           return t.text; // Fallback
                                        }) 
                                      : item.text
                                    }
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )
        }

        // Code Block
        if (token.type === 'code') {
            return (
                 <View key={index} style={styles.codeBlock}>
                    <Text style={styles.codeText}>{token.text}</Text>
                </View>
            );
        }

        // Blockquote
        if (token.type === 'blockquote') {
            return (
                <View key={index} style={{ borderLeftWidth: 2, borderLeftColor: '#D6D3D1', paddingLeft: 8, fontStyle: 'italic', marginBottom: 6 }}>
                    <Text style={[styles.text, textStyle]}>{token.text}</Text>
                </View>
            );
        }

        // Fallback for raw text or unhandled tokens
        if (token.type === 'text') return <Text key={index} style={[styles.text, textStyle]}>{token.text}</Text>;
        
        return null;
      })}
    </View>
  );
};

interface PDFDocumentProps {
  report: ChapterReport;
  inputData: FormData;
}

const PDFDocument: React.FC<PDFDocumentProps> = ({ report, inputData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>ClassEase AI</Text>
          <Text style={styles.brandSub}>Academic Intelligence</Text>
        </View>
        <View>
          <Text style={styles.meta}>{inputData.subject}</Text>
          <Text style={[styles.meta, { fontWeight: 'bold' }]}>{new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.chapterTitle}>{report.chapterTitle}</Text>
      
      {/* Overview */}
      <Markdown>{report.overview}</Markdown>

      {/* Teacher's Insight */}
      <View style={styles.insightBox}>
        <Text style={styles.insightTitle}>Teacher's Insight</Text>
        {/* Pass explicit text style to override default text styles */}
        <Markdown textStyle={styles.insightText}>{report.teacherRecap}</Markdown>
      </View>

      {/* Key Terms */}
      <Text style={styles.sectionTitle}>Lexicon & Definitions</Text>
      <View>
        {report.keyTerms.map((term, i) => (
          <View key={i} style={styles.defItem}>
            <Text style={styles.defTerm}>{term.term}</Text>
            <Markdown>{term.definition}</Markdown>
          </View>
        ))}
      </View>

      {/* Core Concepts */}
      <Text style={styles.sectionTitle} break>Core Concepts</Text>
      {report.conceptBreakdown.map((concept, i) => (
        <View key={i} style={styles.conceptBox}>
          <View style={styles.conceptHeader}>
            <Text style={styles.conceptNumber}>0{i + 1}</Text>
            <Text style={styles.conceptTitle}>{concept.title}</Text>
          </View>
          <View style={{ paddingLeft: 14, borderLeftWidth: 1, borderLeftColor: '#E7E5E4' }}>
            <Markdown>{concept.explanation}</Markdown>
          </View>
        </View>
      ))}

      {/* Methodology & Formulas */}
      {/* Rendering always to ensure section exists if data exists */}
      {report.formulaeOrSteps && report.formulaeOrSteps.length > 0 && (
        <View break={report.conceptBreakdown.length > 3}>
            <Text style={styles.sectionTitle}>Methodology & Formulas</Text>
            {report.formulaeOrSteps.map((item, i) => (
                <View key={i} style={{ marginBottom: 4 }}>
                   {/* Wrapping in Markdown to parse any bolding/code in the formula steps */}
                   <Markdown>{item}</Markdown>
                </View>
            ))}
        </View>
      )}

      {/* Real World Context */}
      <View break={false} style={{ marginTop: 10 }}>
          <Text style={styles.sectionTitle}>Real World Context</Text>
          <Markdown>{report.realWorldApplications}</Markdown>
      </View>

      {/* Chapter Synopsis */}
      <View break={false} style={{ marginTop: 10 }}>
          <Text style={styles.sectionTitle}>Chapter Synopsis</Text>
          <Markdown>{report.summary}</Markdown>
      </View>

      {/* References & Sources */}
      {report.citations && report.citations.length > 0 && (
          <View style={styles.citationBox} break={false}>
              <Text style={[styles.sectionTitle, { fontSize: 14, marginTop: 0 }]}>References & Sources</Text>
              {report.citations.map((cite, i) => (
                  <View key={i} style={styles.citationItem}>
                      <Text style={styles.citationBullet}>{i + 1}.</Text>
                      <Text style={styles.citationText}>{cite}</Text>
                  </View>
              ))}
          </View>
      )}
      
      {/* Footer Branding */}
      <Text style={{ position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#A8A29E' }}>
          Generated by ClassEase AI • Your Personal Academic Tutor
      </Text>

    </Page>
  </Document>
);

export default PDFDocument;